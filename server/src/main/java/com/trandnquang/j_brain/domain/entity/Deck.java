package com.trandnquang.j_brain.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Deck Entity mapping the `decks` SQL table.
 * 
 * WHY: Establishes a 1-to-many relationship with Users and acts as the logical
 * container
 * for Flashcards.
 */
@Entity
@Table(name = "decks", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "name" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
