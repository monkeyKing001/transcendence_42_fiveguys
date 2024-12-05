export enum TokenType {
  PARTIAL = "partial",
  FULL = "full",
}

export interface TokenPayload {
  id: number; // user id
  intraId: string;
  type: TokenType;
}
