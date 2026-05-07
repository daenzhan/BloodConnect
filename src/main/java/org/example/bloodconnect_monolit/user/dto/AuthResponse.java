package org.example.bloodconnect_monolit.user.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String type = "Bearer";

    @JsonProperty("userId")
    private Long userId;

    private String email;
    private String role;
}
