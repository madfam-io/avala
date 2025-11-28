"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Role } from "@avala/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateUser } from "@/hooks/useUsers";
import { Loader2 } from "lucide-react";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.nativeEnum(Role),
  curp: z
    .string()
    .length(18, "CURP must be exactly 18 characters")
    .regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/, "Invalid CURP format")
    .optional()
    .or(z.literal("")),
  rfc: z
    .string()
    .min(12, "RFC must be 12-13 characters")
    .max(13, "RFC must be 12-13 characters")
    .optional()
    .or(z.literal("")),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  COMPLIANCE_OFFICER: "Oficial de Cumplimiento",
  ECE_OC_ADMIN: "Admin ECE/OC",
  ASSESSOR: "Evaluador",
  INSTRUCTOR: "Instructor",
  SUPERVISOR: "Supervisor",
  TRAINEE: "Participante",
};

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const createUserMutation = useCreateUser();
  const [selectedRole, setSelectedRole] = useState<Role>(Role.TRAINEE);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: Role.TRAINEE,
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const payload = {
        email: data.email,
        password: data.password || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        role: selectedRole,
        curp: data.curp || undefined,
        rfc: data.rfc || undefined,
      };

      await createUserMutation.mutateAsync(payload);

      // Reset form and close dialog on success
      reset();
      setSelectedRole(Role.TRAINEE);
      onOpenChange(false);
    } catch (error) {
      // Error handling is managed by the mutation
      console.error("Failed to create user:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to your organization. A random password will be
            generated if not provided.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="Juan"
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Pérez"
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="juan.perez@example.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (Optional)</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="Leave empty for auto-generated password"
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {roleLabels[selectedRole]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {Object.entries(roleLabels).map(([role, label]) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => setSelectedRole(role as Role)}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <Label htmlFor="curp">CURP (Optional)</Label>
            <Input
              id="curp"
              {...register("curp")}
              placeholder="ABCD123456HDFLRN09"
              className="font-mono"
              maxLength={18}
            />
            {errors.curp && (
              <p className="text-xs text-destructive">{errors.curp.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mexican unique population registry code (18 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rfc">RFC (Optional)</Label>
            <Input
              id="rfc"
              {...register("rfc")}
              placeholder="ABCD123456ABC"
              className="font-mono"
              maxLength={13}
            />
            {errors.rfc && (
              <p className="text-xs text-destructive">{errors.rfc.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Federal taxpayer registry (12-13 characters)
            </p>
          </div>

          {createUserMutation.isError && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                {createUserMutation.error instanceof Error
                  ? createUserMutation.error.message
                  : "Failed to create user. Please try again."}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedRole(Role.TRAINEE);
                onOpenChange(false);
              }}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
