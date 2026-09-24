export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  area: string;
  loc: string;
  img: string;
  status: string;
  description: string;
  fullDetails: string;
  specs: string[];
  challenges: string[];
  solutions: string[];
  gallery: string[];
}

export const portfolioItems: PortfolioItem[] = [];
