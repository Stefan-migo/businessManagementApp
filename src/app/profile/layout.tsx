import UserHeader from "@/components/layout/UserHeader";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UserHeader />
      {children}
    </>
  );
}

