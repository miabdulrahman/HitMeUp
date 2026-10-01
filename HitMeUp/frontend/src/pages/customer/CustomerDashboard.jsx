import {
    Home,
    ShoppingBag,
    Heart,
    CreditCard,
    MapPin,
    User,
    Settings,
    LogOut,
} from "lucide-react";

const CustomerDashBoard = () => {
    return (
        <div>
            <aside>
                <div>
                    <h4>
                        HitMeUp
                    </h4>
                    <small>

                    </small>
                </div>
                <div>
                    <p>

                    </p>
                    <SidebarItem />
                    <SidebarItem />
                    <SidebarItem />
                    <SidebarItem />
                    <SidebarItem />
                    <p>
                        Account
                    </p>
                    <SidebarItem />
                    <SidebarItem />
                    <SidebarItem />
                </div>
            </aside>
            <main>
                <header>
                    <div>
                        <div>
                            <h4>
                                Dashboard
                            </h4>
                            <small>
                                Welcome back! Here's what's happening with your orders.
                            </small>
                        </div>
                        <div>
                            <div>
                                <div>
                                    Prabhath
                                </div>
                                <small>
                                    Customer
                                </small>
                            </div>
                            <div>
                                <User size={20} />
                            </div>
                        </div>
                    </div>
                </header>
                <section>
                    <h5>
                        Overview
                    </h5>
                    <div>
                        <DashboardCard />
                        <DashboardCard />
                        <DashboardCard />
                    </div>
                </section>
            </main>
        </div>
    );
};

const SidebarItem = ({ icon, text, active = false }) => {

    return (
        <div
            className="d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            style={{
                cursor: "pointer",
                backgroundColor: active ? "#FFF0ED" : "transparent",
                color: active ? "#FF4A2F" : "#141922",
            }}
        >
            {icon}

            <span className="fw-medium">
                {text}
            </span>
        </div>
    );
};

const DashboardCard = ({ title, value, description }) => {
    return (
        <div>
            <div>
                <p>
                    {title}
                </p>
                <h2>
                    {value}
                </h2>
                <small>
                    {description}
                </small>
            </div>
        </div>
    );
};

export default CustomerDashBoard;