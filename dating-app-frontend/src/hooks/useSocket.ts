import { DefaultEventsMap } from "./../../node_modules/@socket.io/component-emitter/lib/esm/index.d";
import { useState } from "react";
import { Socket } from "socket.io-client";

const useSocket = () => {
  const [socket, setSocket] = useState<any>();
  const setCurrentSocket = (
    currentSocket: Socket<DefaultEventsMap, DefaultEventsMap>
  ) => {
    setSocket(() => currentSocket);
  };
  return { socket, setCurrentSocket };
};

export default useSocket;
