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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { User, UserRole } from "@/types/schema";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
  currentUserRole: UserRole;
  roleFilter?: string | null;
  onSave: (user: Partial<User>) => Promise<void>;
}

export function UserForm({
  open,
  onOpenChange,
  user,
  currentUserRole,
  roleFilter,
  onSave,
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<
    Partial<User & { password?: string }>
  >(
    user || {
      name: "",
      email: "",
      roleId: 4,
      status: "ACTIVE",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      dni: "",
      rnt: "",
      password: "",
    },
  );

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      const defaultRoleId =
        roleFilter === "CUSTOMER"
          ? 4
          : roleFilter === "EMPLOYEE"
            ? 3
            : roleFilter === "ADMIN"
              ? 2
              : roleFilter === "SUPER_ADMIN"
                ? 1
                : 4;
      setFormData({
        name: "",
        email: "",
        roleId: defaultRoleId,
        status: "ACTIVE",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        dni: "",
        rnt: "",
        password: "",
      });
    }
  }, [user, roleFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = { ...formData };
    if (
      user?.id &&
      (!dataToSave.password || dataToSave.password.trim() === "")
    ) {
      delete dataToSave.password;
    }

    try {
        await onSave(dataToSave);
       
    } catch (error) {
      
    }
  };

  const availableRoles = [
    { id: 4, name: "CLIENTE" },
    { id: 99, name: "SIN ROL" },
  ];

  if (currentUserRole === "SUPER_ADMIN") {
    availableRoles.unshift(
      { id: 1, name: "SUPER ADMIN" },
      { id: 2, name: "ADMIN" },
      { id: 3, name: "EMPLEADO" },
    );
  } else if (currentUserRole === "ADMIN") {
    availableRoles.unshift({ id: 3, name: "EMPLEADO" });
  }

  const isAuthorized =
    currentUserRole === "SUPER_ADMIN" ||
    (currentUserRole === "ADMIN" &&
      user?.role?.name !== "ADMIN" &&
      user?.role?.name !== "SUPER_ADMIN") ||
    (currentUserRole === "EMPLOYEE" &&
      (user?.role?.name === "CUSTOMER" || !user?.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background border-4 border-secondary/60 text-foreground max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle>
            {user?.id ? "Editar Usuario" : "Crear Usuario"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {!isAuthorized
              ? "No tienes permisos para modificar este perfil."
              : user?.id
                ? "Modifica los datos del usuario existente."
                : "Registra un nuevo usuario en el sistema."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <fieldset disabled={!isAuthorized} className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Información Personal
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-background border-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI / Identificación</Label>
                  <Input
                    id="dni"
                    value={formData.dni || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dni: e.target.value })
                    }
                    className="bg-background border-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rnt">RNT (Registro Nacional Tributario)</Label>
                  <Input
                    id="rnt"
                    value={formData.rnt || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, rnt: e.target.value })
                    }
                    className="bg-background border-input"
                    placeholder="Ingrese el número tributario si aplica..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-background border-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-background border-input"
                  />
                </div>
              </div>
            </div>

            {/* Seguridad y Rol */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Seguridad y Rol
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Contraseña{" "}
                    {user?.id && (
                      <span className="text-xs text-muted-foreground font-normal">
                        (Dejar en blanco para no cambiar)
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="bg-background border-input pr-10"
                      required={!user?.id}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={formData.roleId?.toString()}
                      onValueChange={(v) =>
                        setFormData({ ...formData, roleId: parseInt(v) })
                      }
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Seleccionar Rol" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({ ...formData, status: v as any })
                      }
                    >
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="ACTIVE">ACTIVO</SelectItem>
                        <SelectItem value="SUSPENDIDO">SUSPENDIDO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Dirección
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Calle y Número</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="bg-background border-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Provincia/Estado</Label>
                  <Input
                    id="state"
                    value={formData.state || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="bg-background border-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Código Postal</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    className="bg-background border-input"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-muted-foreground hover:bg-muted hover:cursor-pointer"
            >
              Cancelar
            </Button>
            {isAuthorized && (
              <Button
                type="submit"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground min-w-[150px] shadow-lg shadow-secondary/20 hover:cursor-pointer"
              >
                Guardar Cambios
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
