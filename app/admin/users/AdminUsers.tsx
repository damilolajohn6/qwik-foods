/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Pusher from "pusher-js";

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["user", "admin"]),
});

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Fetch users
  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      setUsers(await res.json());
    } else {
      toast.error("Failed to load users");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe("users");

    channel.bind("user-added", (newUser: User) => {
      setUsers((prev) => [newUser, ...prev]);
      toast.success(`User ${newUser.name} added`);
    });

    channel.bind("user-updated", (updatedUser: User) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
      );
      toast.success(`User ${updatedUser.name} updated`);
    });

    channel.bind("user-deleted", ({ id }: { id: string }) => {
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success(`User deleted`);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
    
  }, []);

  // Handle form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = userSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    const method = editUserId ? "PATCH" : "POST";
    const url = "/api/users";
    const payload = editUserId ? { id: editUserId, ...formData } : formData;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editUserId ? "User updated" : "User added");
      setFormData({ name: "", email: "", password: "", role: "user" });
      setEditUserId(null);
      fetchUsers();
    } else {
      const error = await res.json();
      toast.error(error.error || "Something went wrong");
    }
  }

  // Handle delete
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      toast.success("User deleted");
      fetchUsers();
    } else {
      const error = await res.json();
      toast.error(error.error || "Failed to delete");
    }
  }

  function handleEdit(user: User) {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setEditUserId(user._id);
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin - Manage Users</h1>

      {/* Add/Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow mb-6 grid gap-4 sm:grid-cols-2"
      >
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
          className="border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData((f) => ({ ...f, email: e.target.value }))
          }
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData((f) => ({ ...f, password: e.target.value }))
          }
          className="border p-2 rounded"
        />
        <select
          value={formData.role}
          onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value }))}
          className="border p-2 rounded"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 sm:col-span-2"
        >
          {editUserId ? "Update User" : "Add User"}
        </button>
      </form>

      {/* User Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(u)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
