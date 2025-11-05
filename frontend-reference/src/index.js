import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";
import store from "./redux/store";
import "./index.css";
import "./responsive.css";
import App from "./App";
const divRoot = document.getElementById("root");

if (divRoot) {
  const root = ReactDOM.createRoot(divRoot);
  root.render(
    // <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Provider> 

    // </React.StrictMode>
  );
}
