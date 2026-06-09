import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider as Router } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/",
        element: <div>Hello World</div>,
    },
]);

const root = document.getElementById("root");

if (root) {
    ReactDOM.createRoot(root).render(<Router router={router} />);
} else {
    console.error("Root element not found");
}
