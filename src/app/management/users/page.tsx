"use client";

import { CartPreviewDialog } from "@/components/management/users/cart-preview-dialog";
import { UserDetails } from "@/components/management/users/user-details";
import { UserForm } from "@/components/management/users/user-form";
import { UserTable } from "@/components/management/users/user-table";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { UsersAPI } from "@/services/api";
import branchService from "@/services/branch.service";
import { useBranchStore } from "@/store/branch.store";
import { useAuthStore } from "@/store/use-auth-store";
import { Branch, User, UserRole } from "@/types/schema";
import { Filter, Plus, RefreshCw, UsersIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const roleFilter = searchParams.get("role");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartUserId, setCartUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { activeBranch } = useBranchStore();
  const currentUserRole = (user?.role?.name || "EMPLOYEE") as UserRole;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");

  const loadBranches = useCallback(async () => {
    try {
      const data = await branchService.getAll();
      setBranches(data);
    } catch (error) {}
  }, []);

  const loadUsers = useCallback(
    async (pageNum = page) => {
      setLoading(true);
      try {
        const response = await UsersAPI.getAll({
          page: pageNum,
          limit,
          search,
          branchId: selectedBranchId,
          role: roleFilter,
        });
        const paginatedData = response.data;
        setUsers(paginatedData?.data || []);
        setTotalPages(paginatedData?.totalPages || 1);
        setPage(paginatedData?.page || 1);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast, page, limit, search, selectedBranchId, roleFilter],
  );

  useEffect(() => {
    setSearch("");
    setPage(1);
    loadUsers(1);
    loadBranches();
  }, [loadBranches, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedBranchId]);

  useEffect(() => {
    if (activeBranch) {
      setSelectedBranchId(activeBranch.id.toString());
    } else {
      setSelectedBranchId("all");
    }
  }, [activeBranch]);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user && user.id ? user : undefined);
    setIsFormOpen(true);
  };

  const handleViewCart = (user: User) => {
    setCartUserId(user.id);
    setIsCartOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
      if (currentUserRole === "EMPLOYEE" && user.role?.name !== "CUSTOMER") {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para eliminar este tipo de usuario.",
          variant: "destructive",
        });
        return;
      }
      try {
        await UsersAPI.delete(user.id);
        toast({
          title: "Usuario eliminado",
          description: `El usuario ${user.name} ha sido eliminado.`,
        });
        loadUsers(page);
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Error al eliminar usuario";
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    }
  };

  const handleSaveUser = async (data: Partial<User>) => {
    try {
      if (editingUser) {
        await UsersAPI.update(editingUser.id, data);
        toast({
          title: "Usuario actualizado",
          description: "Cambios guardados.",
        });
      } else {
        const payload = { ...data };
        if (selectedBranchId !== "all" && !payload.branchId) {
          payload.branchId = parseInt(selectedBranchId);
        }
        await UsersAPI.create(payload);
        toast({
          title: "Usuario creado",
          description: "Usuario registrado con éxito.",
        });
      }
      
      setIsFormOpen(false);
      setEditingUser(undefined);
      
      if (!editingUser) {
        loadUsers(1);
      } else {
        loadUsers(page);
      }
    } catch (error: unknown) {
      const errorObj = error as any;
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Error al guardar usuario";

      if (
        message.toLowerCase().includes("email") ||
        message.toLowerCase().includes("correo") ||
        message.toLowerCase().includes("duplicate")
      ) {
        toast({
          title: "Correo electrónico ya registrado",
          description:
            "El correo electrónico ya está en uso. Por favor, utiliza otro correo.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    }
  };

  const headerInfo = useMemo(() => {
    switch (roleFilter) {
      case "CUSTOMER":
        return {
          title: "Gestión de Clientes",
          description: "Administra la base de datos de clientes y sus compras.",
        };
      case "EMPLOYEE":
        return {
          title: "Gestión de Empleados",
          description: "Administra el personal y sus permisos.",
        };
      case "ADMIN":
        return {
          title: "Gestión de Administradores",
          description: "Administra los usuarios con privilegios elevados.",
        };
      case "SUPER_ADMIN":
        return {
          title: "Gestión de Super Admins",
          description: "Administra los usuarios con acceso total.",
        };
      default:
        return {
          title: "Gestión de Usuarios",
          description: "Administra clientes, empleados y administradores.",
        };
    }
  }, [roleFilter]);

  return (
    <div className="sm:p-8 p-0 pt-2 space-y-6 sm:pb-20 pb-40">
      {/* Breadcrumbs */}
      <Breadcrumb className="px-2 ">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/management">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{headerInfo.title}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <UsersIcon className="h-6 w-6" />
            {headerInfo.title}
          </h1>
          <p className="text-muted-foreground">{headerInfo.description}</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-full md:w-[250px] bg-background border-input text-foreground">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id.toString()}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botón Nuevo Usuario - Solo permitido para empleados si están en el filtro de Clientes, y para ADMINs si no están viendo otros admins */}
          {(currentUserRole === "SUPER_ADMIN" ||
            (currentUserRole === "ADMIN" &&
              roleFilter !== "ADMIN" &&
              roleFilter !== "SUPER_ADMIN") ||
            (currentUserRole === "EMPLOYEE" && roleFilter === "CUSTOMER")) && (
            <Button
              onClick={() => handleEdit({} as User)}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm text-white hover:cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => loadUsers(1)}
            disabled={loading}
            title="Recargar"
            className="bg-background hover:bg-muted border-input text-foreground hover:cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <UserTable
        data={users}
        currentUserRole={currentUserRole}
        currentFilter={roleFilter}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewCart={handleViewCart}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        pagination={{
          page,
          totalPages,
          onPageChange: (newPage: number) => {
            setPage(newPage);
            loadUsers(newPage);
          },
        }}
      />

      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent
          className="w-screen max-w-none sm:max-w-none h-full bg-white p-0"
          side="right"
        >
          <SheetTitle className="sr-only">Detalles del Usuario</SheetTitle>
          {selectedUser && (
            <UserDetails
              user={selectedUser}
              onClose={() => setIsDetailsOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={editingUser}
        currentUserRole={currentUserRole}
        roleFilter={roleFilter}
        onSave={handleSaveUser}
      />

      <CartPreviewDialog
        userId={cartUserId}
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
      />
    </div>
  );
}
