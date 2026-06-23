package com.swappable.backend.category;

import jakarta.persistence.*;
import org.hibernate.envers.Audited;


@Entity
@Audited
@Table(name = "categories")
public class Category {

    @ManyToOne
    @Audited(targetAuditMode = org.hibernate.envers.RelationTargetAuditMode.NOT_AUDITED)
    private Category category;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
