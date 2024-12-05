import { useState,useContext,createContext } from "react";
interface ProviderProps {
    children: React.ReactNode;
}
export const CurPageContext = createContext<{
    match: string;
    set: React.Dispatch<React.SetStateAction<string>>;
  }>({ match: "", set: () => {} });
  
  export function CurPageProvider({ children }: ProviderProps) {
    const [curPage, setCurPage] = useState<string>("");
    const value = { match: curPage, set: setCurPage };
  
    return (
      <CurPageContext.Provider value={value}>{children}</CurPageContext.Provider>
    );
  }

  export function useCurPage() {
    return useContext(CurPageContext);
  }