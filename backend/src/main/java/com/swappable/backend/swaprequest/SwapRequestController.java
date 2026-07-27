package com.swappable.backend.swaprequest;

import com.swappable.backend.auth.AuthUtils;
import com.swappable.backend.item.Item;
import com.swappable.backend.item.ItemRepository;
import com.swappable.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.ResponseEntity;
import com.swappable.backend.common.PagedResponse;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;



@RestController
@RequestMapping("/api/swap-requests")
public class SwapRequestController {

    private final SwapRequestRepository swapRequestRepository;
    private final ItemRepository itemRepository;

    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_ACCEPTED = "accepted";
    private static final String STATUS_DECLINED = "declined";
    private static final String STATUS_COMPLETED = "completed";
    private static final String ITEM_STATUS_AVAILABLE = "available";
    private static final String ITEM_STATUS_SWAPPED = "swapped";


    public SwapRequestController(
            SwapRequestRepository swapRequestRepository,
            ItemRepository itemRepository
    ) {
        this.swapRequestRepository = swapRequestRepository;
        this.itemRepository = itemRepository;
    }

    @PostMapping
    public SwapRequestResponse createSwapRequest(@Valid @RequestBody CreateSwapRequest request) {

        User requester = AuthUtils.getAuthenticatedUser();

        Item requestedItem = itemRepository.findById(request.requestedItemId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Requested item not found"
                ));

        Item offeredItem = itemRepository.findById(request.offeredItemId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Offered item not found"
                ));

        if (!offeredItem.getUser().getId().equals(requester.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only offer items that belong to you"
            );
        }

        if (requestedItem.getUser().getId().equals(requester.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot request a swap for your own item"
            );
        }

        if (request.requestedItemId().equals(request.offeredItemId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested item and offered item cannot be the same"
            );
        }

        if (!ITEM_STATUS_AVAILABLE.equalsIgnoreCase(requestedItem.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested item is not available"
            );
        }

        if (!ITEM_STATUS_AVAILABLE.equalsIgnoreCase(offeredItem.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Offered item is not available"
            );
        }

        boolean duplicateRequestExists = swapRequestRepository
                .existsByRequesterIdAndRequestedItemIdAndOfferedItemIdAndStatus(
                        requester.getId(),
                        requestedItem.getId(),
                        offeredItem.getId(),
                        STATUS_PENDING
                );

        if (duplicateRequestExists) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You already have a pending swap request for these items"
            );
        }

        SwapRequest swapRequest = new SwapRequest();
        swapRequest.setRequester(requester);
        swapRequest.setOwner(requestedItem.getUser());
        swapRequest.setRequestedItem(requestedItem);
        swapRequest.setOfferedItem(offeredItem);
        swapRequest.setStatus(STATUS_PENDING);
        swapRequest.setMessage(request.message());

        SwapRequest savedSwapRequest = swapRequestRepository.save(swapRequest);

        return toResponse(savedSwapRequest, requester.getId());
    }

    @GetMapping("/received")
    public PagedResponse<SwapRequestResponse> getIncomingSwapRequests(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User owner = AuthUtils.getAuthenticatedUser();

        Page<SwapRequestResponse> page = swapRequestRepository.findByOwner(owner, pageable)
                .map(swapRequest -> toResponse(swapRequest, owner.getId()));

        return PagedResponse.from(page);
    }

    @GetMapping("/sent")
        public PagedResponse<SwapRequestResponse> getOutgoingSwapRequests(
                @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
        ) {
        User requester = AuthUtils.getAuthenticatedUser();

        Page<SwapRequestResponse> page = swapRequestRepository.findByRequester(requester, pageable)
                .map(swapRequest -> toResponse(swapRequest, requester.getId()));

        return PagedResponse.from(page);
    }

    @PostMapping("/{id}/accept")
    public SwapRequestResponse acceptSwapRequest(@PathVariable Integer id) {
        User owner = AuthUtils.getAuthenticatedUser();

        SwapRequest swapRequest = swapRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Swap request not found"
                ));

        if (!swapRequest.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only accept swap requests for your own items"
            );
        }

        if (!swapRequest.getStatus().equals(STATUS_PENDING)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Swap request has already been processed"
            );
        }

        swapRequest.setStatus(STATUS_ACCEPTED);
        swapRequest.getRequestedItem().setStatus(ITEM_STATUS_SWAPPED);
        swapRequest.getOfferedItem().setStatus(ITEM_STATUS_SWAPPED);
        SwapRequest savedSwapRequest = swapRequestRepository.save(swapRequest);

        return toResponse(savedSwapRequest, owner.getId());
    }

    @PostMapping("/{id}/confirm")
    @Transactional
    public SwapRequestResponse confirmSwapRequest(@PathVariable Integer id) {
        User currentUser = AuthUtils.getAuthenticatedUser();

        SwapRequest swapRequest = swapRequestRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Swap request not found"
                ));

        boolean isRequester = swapRequest.getRequester().getId().equals(currentUser.getId());
        boolean isOwner = swapRequest.getOwner().getId().equals(currentUser.getId());

        if (!isRequester && !isOwner) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only confirm your own swaps"
            );
        }

        if (!swapRequest.getStatus().equals(STATUS_ACCEPTED)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only accepted swaps can be confirmed"
            );
        }

        if (isRequester) {
            swapRequest.setRequesterConfirmed(true);
        } else {
            swapRequest.setOwnerConfirmed(true);
        }

        // both sides confirmed: complete the swap and archive the items so they drop off the listings
        if (swapRequest.isRequesterConfirmed() && swapRequest.isOwnerConfirmed()) {
            swapRequest.setStatus(STATUS_COMPLETED);
            swapRequest.setCompletedAt(LocalDateTime.now());
            swapRequest.getRequestedItem().setArchived(true);
            swapRequest.getOfferedItem().setArchived(true);
        }

        SwapRequest savedSwapRequest = swapRequestRepository.save(swapRequest);

        return toResponse(savedSwapRequest, currentUser.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelSwapRequest(@PathVariable Integer id) {
        User currentUser = AuthUtils.getAuthenticatedUser();

        SwapRequest swapRequest = swapRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Swap request not found"
                ));

        // Ensuring that only the user who created (requested) the swap can cancel/delete it
        if (!swapRequest.getRequester().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only cancel your own swap requests"
            );
        }


        if (!swapRequest.getStatus().equals(STATUS_PENDING)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Can only delete pending swap requests"
            );
        }

        swapRequestRepository.delete(swapRequest);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/decline")
    public SwapRequestResponse declineSwapRequest(@PathVariable Integer id) {
        User owner = AuthUtils.getAuthenticatedUser();

        SwapRequest swapRequest = swapRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Swap request not found"
                ));

        if (!swapRequest.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only decline swap requests for your own items"
            );
        }

        if (!swapRequest.getStatus().equals(STATUS_PENDING)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Swap request has already been processed"
            );
        }

        swapRequest.setStatus(STATUS_DECLINED);

        SwapRequest savedSwapRequest = swapRequestRepository.save(swapRequest);

        return toResponse(savedSwapRequest, owner.getId());
    }



    private SwapRequestResponse toResponse(SwapRequest swapRequest, Integer currentUserId) {
        ContactDetails contactDetails = null;

        // contact details are only exposed while the swap is being arranged; once completed we drop them
        if (STATUS_ACCEPTED.equals(swapRequest.getStatus())) {
            // show the OTHER person's details, not your own
            User counterparty =
                    swapRequest.getRequester().getId().equals(currentUserId)
                            ? swapRequest.getOwner()
                            : swapRequest.getRequester();

            contactDetails = new ContactDetails(
                    counterparty.getUsername(),
                    counterparty.getEmail(),
                    counterparty.getPhoneNumber()
            );
        }

        return new SwapRequestResponse(
                swapRequest.getId(),
                swapRequest.getRequester().getUsername(),
                swapRequest.getOwner().getUsername(),
                swapRequest.getRequestedItem().getId(),
                swapRequest.getRequestedItem().getTitle(),
                swapRequest.getOfferedItem().getId(),
                swapRequest.getOfferedItem().getTitle(),
                swapRequest.getStatus(),
                swapRequest.getMessage(),
                swapRequest.isRequesterConfirmed(),
                swapRequest.isOwnerConfirmed(),
                swapRequest.getCompletedAt(),
                contactDetails
        );
    }
}