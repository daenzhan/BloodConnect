package org.example.bloodconnect_monolit.admin.request;

import lombok.Data;

@Data
public class BlockUserRequest {
    private Long userId;
    private boolean block;
    private String reason;
}
