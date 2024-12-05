import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = document.getElementById("root");
if (root) {
  const rootElement = ReactDOM.createRoot(root);
  rootElement.render(<App />);
}
