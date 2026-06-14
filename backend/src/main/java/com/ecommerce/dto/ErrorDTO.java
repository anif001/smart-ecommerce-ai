package com.ecommerce.dto;

import java.time.LocalDateTime;

public class ErrorDTO {
    private LocalDateTime timestamp;
    private String message;
    private String details;
    private int status;

    public ErrorDTO() {}

    public ErrorDTO(LocalDateTime timestamp, String message, String details, int status) {
        this.timestamp = timestamp;
        this.message = message;
        this.details = details;
        this.status = status;
    }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }
}
