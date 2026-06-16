package com.swappable.backend.swaprequest;

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

    public SwapRequestController(
            SwapRequestRepository swapRequestRepository,
            ItemRepository itemRepository
    ) {
        this.swapRequestRepository = swapRequestRepository;
        this.itemRepository = itemRepository;
    }

    @PostMapping
    public SwapRequestResponse createSwapRequest(@Valid @RequestBody CreateSwapRequest request) {

        User requester = getAuthenticatedUser();

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

        SwapRequest swapRequest = new SwapRequest();
        swapRequest.setRequester(requester);
        swapRequest.setOwner(requestedItem.getUser());
        swapRequest.setRequestedItem(requestedItem);
        swapRequest.setOfferedItem(offeredItem);
        swapRequest.setStatus(STATUS_PENDING);
        swapRequest.setMessage(request.message());

        SwapRequest savedSwapRequest = swapRequestRepository.save(swapRequest);

        return toResponse(savedSwapRequest);
    }

    @GetMapping("/incoming")
    public List<SwapRequestResponse> getIncomingSwapRequests() {
        User owner = getAuthenticatedUser();

        return swapRequestRepository.findByOwner(owner)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/outgoing")
    public List<SwapRequestResponse> getOutgoingSwapRequests() {
        User requester = getAuthenticatedUser();

        return swapRequestRepository.findByRequester(requester)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        if (!(principal instanceof User user)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "You must be logged in"
            );
        }

        return user;
    }

    @PostMapping("/{id}/accept")
    public SwapRequestResponse acceptSwapRequest(@PathVariable Integer id) {
        User owner = getAuthenticatedUser();

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

        SwapRequest savedSwapRequest = swapRequestRepository.save(swapRequest);

        return toResponse(savedSwapRequest);
    }

    @PostMapping("/{id}/decline")
    public SwapRequestResponse declineSwapRequest(@PathVariable Integer id) {
        User owner = getAuthenticatedUser();

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

        return toResponse(savedSwapRequest);
    }

    private SwapRequestResponse toResponse(SwapRequest swapRequest) {
        return new SwapRequestResponse(
                swapRequest.getId(),
                swapRequest.getRequester().getUsername(),
                swapRequest.getOwner().getUsername(),
                swapRequest.getRequestedItem().getTitle(),
                swapRequest.getOfferedItem().getTitle(),
                swapRequest.getStatus(),
                swapRequest.getMessage()
        );
    }
}