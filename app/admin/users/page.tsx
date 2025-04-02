import { prisma } from "@/lib/prisma/client";

export default async function AdminUsers() {
    const users = await prisma.user.findMany();

    return (
        <div className="admin-users">
            <h1>User Management</h1>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{/* 사용자 관리 액션 버튼들 */}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
