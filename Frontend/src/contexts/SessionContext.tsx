import { createContext, useContext, useState, ReactNode } from "react";
import { PromptEntry } from "@/data/mockData";

interface SessionContextValue {
  prompts: PromptEntry[];
  addPrompt: (entry: PromptEntry) => void;
}

const SessionContext = createContext<SessionContextValue>({
  prompts: [],
  addPrompt: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const addPrompt = (entry: PromptEntry) =>
    setPrompts((prev) => [entry, ...prev]);
  return (
    <SessionContext.Provider value={{ prompts, addPrompt }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
