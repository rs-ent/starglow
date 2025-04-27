import AdminPollsDashboard from "@/components/admin/polls/Admin.Polls.Dashboard";

export default function AdminPolls() {
    return (
        <div className="admin-polls">
            <h1 className="text-2xl font-bold mb-6">Polls Management</h1>
            <AdminPollsDashboard />
        </div>
    );
}
