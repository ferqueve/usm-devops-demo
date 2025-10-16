package com.utec.backend.dto.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para estadísticas de usuarios activos
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveUsersStatsDTO {
    private int totalActiveUsers;
    private List<ActiveUserDTO> activeUsers;
}
