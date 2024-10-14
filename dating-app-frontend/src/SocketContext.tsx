/* eslint-disable @typescript-eslint/no-explicit-any */

import { createContext, ReactNode, useState } from "react";

export type SocketContextType = {
  socket: any;
  setCurrentSocket: (currentSocket: any) => void;
};

export const SocketContext: any = createContext<SocketContextType | undefined>(
  undefined
);
type SocketProviderProps = {
  children: ReactNode;
};

const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState(null);

  const setCurrentSocket = (currentSocket: any) => {
    setSocket(currentSocket);
    console.log(currentSocket);
  };

  const value: SocketContextType = {
    socket,
    setCurrentSocket,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
