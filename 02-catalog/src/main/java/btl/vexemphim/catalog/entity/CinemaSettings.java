package btl.vexemphim.catalog.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "cinema_settings")
public class CinemaSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String name = "CineVe";

    @Column(name = "logo_url", length = 512)
    private String logoUrl;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
