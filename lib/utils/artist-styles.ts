import { ArtistBG } from "./get/artist-colors";
import type { Artist } from "@prisma/client";

export const createArtistGradients = (
    artist: Pick<Artist, "backgroundColors">
) => ({
    primary: `linear-gradient(135deg, ${ArtistBG(artist, 1, 95)}, ${ArtistBG(
        artist,
        0,
        95
    )}, ${ArtistBG(artist, 2, 95)}, ${ArtistBG(artist, 0, 95)})`,
    secondary: `linear-gradient(to bottom right, ${ArtistBG(
        artist,
        2,
        100
    )}, ${ArtistBG(artist, 3, 100)})`,
    radial: `radial-gradient(circle at 50% 50%, ${ArtistBG(
        artist,
        0,
        30
    )}, ${ArtistBG(artist, 1, 15)} 50%, transparent 80%)`,
    conic: `conic-gradient(from 0deg at 50% 50%, 
    transparent 0deg, 
    ${ArtistBG(artist, 0, 30)} 30deg, 
    transparent 60deg,
    transparent 120deg,
    ${ArtistBG(artist, 1, 30)} 150deg,
    transparent 180deg,
    transparent 240deg,
    ${ArtistBG(artist, 2, 30)} 270deg,
    transparent 300deg,
    transparent 360deg)`,
});

export const createArtistShadows = (
    artist: Pick<Artist, "backgroundColors">
) => ({
    glow: `0px 0px 16px 1px ${ArtistBG(artist, 2, 50)}`,
    inset: `0 0 40px ${ArtistBG(artist, 0, 20)}, inset 0 0 30px ${ArtistBG(
        artist,
        2,
        10
    )}`,
    particle: `0 0 10px ${ArtistBG(artist, 0, 60)}`,
});
