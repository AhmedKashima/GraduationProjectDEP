import AdminLayout from "../../components/admin/AdminLayout";
import ChatPanel from "../../components/chat/ChatPanel";

const AdminChat = ({ token, userId }: { token: string; userId: string | number }) => {
  return (
    <AdminLayout title="Чат с командой">
      <ChatPanel userId={userId} recipientId={null} token={token} isAdmin showHeader={false} />
    </AdminLayout>
  );
};

export default AdminChat;
