"use client";

import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { UsersAPI } from "@/services/api";
import branchService from "@/services/branch.service";
import { useAuthStore } from "@/store/use-auth-store";
import { Branch, User } from "@/types/schema";
import { Loader2, Plus, Search, Trash2, UserIcon, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
  onSuccess: () => void;
}

export function BranchDialog({
  open,
  onOpenChange,
  branch,
  onSuccess,
}: BranchDialogProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("details");

  const [formData, setFormData] = useState<Partial<Branch>>({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    isActive: true,
    isHeadquarters: false,
  });

  const [branchUsers, setBranchUsers] = useState<User[]>([]);
  const [candidateUsers, setCandidateUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignedSearchQuery, setAssignedSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      if (branch) {
        setFormData(branch);
        setActiveTab("details");
      } else {
        setFormData({
          name: "",
          code: "",
          address: "",
          city: "",
          state: "",
          phone: "",
          email: "",
          isActive: true,
          isHeadquarters: false,
        });
        setActiveTab("details");
      }
    }
  }, [branch, open]);

  const loadBranchUsers = useCallback(async () => {
    if (!branch) return;
    setUsersLoading(true);
    try {
      const users = await branchService.getUsers(branch.id);
      setBranchUsers(users);
    } catch (error) {
    } finally {
      setUsersLoading(false);
    }
  }, [branch]);

  const loadCandidateUsers = useCallback(async () => {
    try {
      const response = await UsersAPI.getAll({ isStaffOnly: true });
      let users = Array.isArray(response) 
          ? response 
          : Array.isArray(response?.data) 
              ? response.data 
              : Array.isArray(response?.data?.data) 
                  ? response.data.data 
                  : [];

      users = users.filter(
        (u: { role?: { name: string }, roleId?: number }) => 
          u.role?.name !== "CUSTOMER" && u.roleId !== 4 && u.roleId !== 99,
      );

      if (currentUser?.role?.name === "ADMIN") {
        users = users.filter(
          (u: { role?: { name: string } }) => u.role?.name === "EMPLOYEE",
        );
      } else if (currentUser?.role?.name === "SUPER_ADMIN") {
        users = users.filter(
          (u: { role?: { name: string } }) =>
            u.role?.name === "ADMIN" || u.role?.name === "EMPLOYEE",
        );
      } else {
        
        users = users.filter(
          (u: { role?: { name: string } }) => u.role?.name === "EMPLOYEE",
        );
      }

      setCandidateUsers(users);
     
    } catch (error) {
     
    }
  }, [currentUser]);

  useEffect(() => {
    if (open && activeTab === "users" && branch) {
      loadBranchUsers();
      loadCandidateUsers();
    }
  }, [activeTab, branch, open, loadBranchUsers, loadCandidateUsers]);

  const filteredCandidates = candidateUsers
    .filter((user) => {
      // Evitar duplicados: No mostrar usuarios que ya están en la branch
      if (branchUsers.some((bu) => bu.id === user.id)) return false;
      
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.dni && String(user.dni).includes(query))
      );
    })
    .slice(0, 5);

  const handleAddUser = async () => {
    if (!selectedUserId || !branch) return;
    setUsersLoading(true);
    try {
      await branchService.addUser(branch.id, parseInt(selectedUserId));
      toast({ title: "Usuario asignado exitosamente" });
      setSelectedUserId("");
      loadBranchUsers();
    } catch (error: any) {
      toast({
        title: "Error al asignar",
        description:
          error.response?.data?.message || "No se pudo asignar el usuario",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!branch) return;
    if (!confirm("¿Desvincular usuario de esta branch?")) return;

    // Actualización optimista: Remover de la UI inmediatamente
    const previousUsers = [...branchUsers];
    setBranchUsers((prev) => prev.filter((u) => u.id !== userId));

    try {
      await branchService.removeUser(branch.id, userId);
      toast({ title: "Usuario desvinculado" });
    } catch (error: any) {
      // Revertir si falla el servidor
      setBranchUsers(previousUsers);
      toast({
        title: "Error al desvincular",
        description:
          error.response?.data?.message || "No se pudo quitar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (branch) {
        await branchService.update(branch.id, formData);
        toast({ title: "Branch actualizada" });
      } else {
        await branchService.create(formData);
        toast({ title: "Branch creada" });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 bg-background  border-4 border-secondary/60  text-foreground">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-foreground">
            {branch ? `Editar Branch: ${branch.name}` : "Nueva Branch"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Administra los detalles y el personal de la branch.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 pt-2 border-b border-border bg-muted/30">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground"
              >
                Detalles
              </TabsTrigger>
              <TabsTrigger
                value="users"
                disabled={!branch}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-secondary data-[state=active]:bg-transparent px-2 py-3 text-muted-foreground data-[state=active]:text-foreground"
              >
                Usuarios Asignados
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-background">
            <TabsContent value="details" className="mt-0 h-full">
              <form
                id="branch-form"
                onSubmit={handleSubmit}
                className="grid gap-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ej: Branch Centro"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={formData.code || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="Ej: CEN-01"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Calle Falsa 123"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Ciudad"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">Provincia</Label>
                    <Input
                      id="state"
                      value={formData.state || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      placeholder="Provincia"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Latitud</Label>
                    <Input
                      id="latitude"
                      value={formData.latitude || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                      placeholder="-34.6037"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Longitud</Label>
                    <Input
                      id="longitude"
                      value={formData.longitude || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                      placeholder="-58.3816"
                      type="number"
                      step="any"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+54 ..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="branch@empresa.com"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2 border border-border p-3 rounded-md bg-muted/20">
                  <Label
                    htmlFor="isActive"
                    className="flex flex-col space-y-1 cursor-pointer"
                  >
                    <span>Activa</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Desactivar para ocultarla temporalmente.
                    </span>
                  </Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(c) =>
                      setFormData({ ...formData, isActive: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2 border border-border p-3 rounded-md bg-muted/20">
                  <Label
                    htmlFor="isHeadquarters"
                    className="flex flex-col space-y-1 cursor-pointer"
                  >
                    <span>Sede Central</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Marca si esta es la casa matriz.
                    </span>
                  </Label>
                  <Switch
                    id="isHeadquarters"
                    checked={formData.isHeadquarters}
                    onCheckedChange={(c) =>
                      setFormData({ ...formData, isHeadquarters: c })
                    }
                    disabled={branch?.isHeadquarters}
                  />
                </div>
              </form>
            </TabsContent>

            <TabsContent value="users" className="mt-0 space-y-4">
              <div className="flex flex-col gap-2 bg-muted/30 p-4 rounded-lg border border-border">
                <Label>Agregar Usuario</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, email o DNI..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedUserId("");
                      }}
                      className="pl-8 bg-background"
                    />
                  </div>
                  <Button
                    onClick={handleAddUser}
                    disabled={!selectedUserId || usersLoading}
                    className="hover:cursor-pointer"
                  >
                    {usersLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Asignar
                  </Button>
                </div>

                {(searchQuery.length > 0 || selectedUserId) && (
                  <div className="border border-border rounded-md bg-background shadow-sm overflow-hidden mt-1">
                    {selectedUserId && !searchQuery ? (
                      <div className="p-2 bg-secondary/10 border-l-4 border-secondary flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">
                          {
                            candidateUsers.find(
                              (u) => u.id.toString() === selectedUserId,
                            )?.name
                          }
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUserId("")}
                          className="h-6 w-6 p-0 hover:bg-muted hover:cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : filteredCandidates.length > 0 ? (
                      <div className="max-h-[200px] overflow-y-auto">
                        {filteredCandidates.map((user) => (
                          <div
                            key={user.id}
                            className={cn(
                              "p-2 text-sm cursor-pointer hover:bg-muted flex items-center justify-between text-foreground",
                              selectedUserId === user.id.toString() &&
                                "bg-muted",
                            )}
                            onClick={() => {
                              setSelectedUserId(user.id.toString());
                              setSearchQuery("");
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                            {user.role && (
                              <Badge variant="outline" className="text-[10px]">
                                {user.role.name}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        No se encontraron usuarios.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Usuarios Asignados ({branchUsers.length})
                  </h3>
                </div>

                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar asignados..."
                    value={assignedSearchQuery}
                    onChange={(e) => setAssignedSearchQuery(e.target.value)}
                    className="pl-8 bg-background"
                  />
                </div>

                {usersLoading && branchUsers.length === 0 ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                ) : branchUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    <UserIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p>No hay usuarios asignados a esta branch.</p>
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                    {branchUsers
                      .filter((u) => {
                        if (!assignedSearchQuery) return true;
                        const q = assignedSearchQuery.toLowerCase();
                        return (
                          (u.name && String(u.name).toLowerCase().includes(q)) ||
                          (u.email && String(u.email).toLowerCase().includes(q)) ||
                          (u.dni && String(u.dni).includes(q))
                        );
                      })
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg bg-card text-card-foreground shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                              {user.name?.substring(0, 2).toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-medium text-sm flex items-center gap-2">
                                {user.name}
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-4"
                                >
                                  {user.role?.name}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                          {currentUser?.role?.name === "SUPER_ADMIN" ||
                          (currentUser?.role?.name === "ADMIN" &&
                            user.role?.name !== "ADMIN" &&
                            user.role?.name !== "SUPER_ADMIN") ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:cursor-pointer hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveUser(user.id)}
                              disabled={usersLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <div className="w-10" /> 
                          )}
                        </div>
                      ))}
                    {branchUsers.length > 0 &&
                      branchUsers.filter((u) => {
                        if (!assignedSearchQuery) return true;
                        const q = assignedSearchQuery.toLowerCase();
                        return (
                          (u.name && u.name.toLowerCase().includes(q)) ||
                          (u.email && u.email.toLowerCase().includes(q)) ||
                          (u.dni && u.dni.includes(q))
                        );
                      }).length === 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No se encontraron usuarios asignados con ese criterio.
                        </div>
                      )}
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30 mt-auto gap-2 sm:gap-0">
          {activeTab === "details" ? (
            <Button
              className="hover:cursor-pointer"
              type="submit"
              form="branch-form"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="hover:cursor-pointer border-border hover:bg-muted"
            >
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
