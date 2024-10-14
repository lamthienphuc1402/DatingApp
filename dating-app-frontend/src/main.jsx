import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import SocketProvider from "./SocketContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Create a client
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")).render(
  <SocketProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </SocketProvider>
);
