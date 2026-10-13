import { useLocation } from "react-router-dom";

const SellerDashboard = () => {
    const Location = useLocation();
    const user = Location.state?.user;

    if (!user) {
        return <p>user information is unavailable</p>
    }
    return (
        <div>
            {user.name}
            {user.role}
        </div>
    )
}

export default SellerDashboard;