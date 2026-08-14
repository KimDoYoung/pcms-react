export interface TmdbMovieDto {
  id: number;
  title: string;
  originalTitle?: string;
  overview?: string;
  posterPath?: string;
  posterUrl?: string;
  releaseDate?: string;
  voteAverage?: number;
  popularity?: number;
  originalLanguage?: string;
}
