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

import java.util.List;

@RestController
@RequestMapping("/api/swap-requests")
public class SwapRequestController {

    private final SwapRequestRepository swapRequestRepository;
    private final ItemRepository itemRepository;

    private static final String STATUS_PENDING = "pending";
    private static final String STATUS_ACCEPTED = "accepted";
    private static final String STATUS_DECLINED = "declined";
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
    public List<SwapRequestResponse> getIncomingSwapRequests() {
        User owner = AuthUtils.getAuthenticatedUser();

        return swapRequestRepository.findByOwner(owner)
                .stream()
                .map(swapRequest -> toResponse(swapRequest, owner.getId()))
                .toList();
    }

    @GetMapping("/sent")
    public List<SwapRequestResponse> getOutgoingSwapRequests() {
        User requester = AuthUtils.getAuthenticatedUser();

        return swapRequestRepository.findByRequester(requester)
                .stream()
                .map(swapRequest -> toResponse(swapRequest, requester.getId()))
                .toList();
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

        if (!STATUS_PENDING.equals(swapRequest.getStatus())) {            throw new ResponseStatusException(
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
                contactDetails
        );
    }
}