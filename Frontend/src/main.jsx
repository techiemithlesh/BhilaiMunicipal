import ReactDOM from "react-dom/client";
import "./index.scss";
import App from "./App";
import { NextUIProvider } from "@nextui-org/react";
import { Provider } from "react-redux";
import { persistor, store } from "./store";
import { PersistGate } from "redux-persist/integration/react";



ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <NextUIProvider>
        <App />
      </NextUIProvider>
    </PersistGate>
  </Provider>
);
