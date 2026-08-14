import type {
  AdminProject,
  AdminProjectCategory,
  AdminProjectPayload,
  AdminProjectUser,
} from "@/services/adminProjectsService";

export type AdminProjectFormValue = AdminProjectPayload[keyof AdminProjectPayload];
export type AdminProjectUpdate = (
  key: keyof AdminProjectPayload,
  value: AdminProjectFormValue,
) => void;

export interface AdminProjectSectionProps {
  form: AdminProjectPayload;
  update: AdminProjectUpdate;
  errors: Record<string, string>;
}

export interface AdminProjectIdentityProps extends AdminProjectSectionProps {
  owners: AdminProjectUser[];
  categories: AdminProjectCategory[];
}

export interface AdminProjectGovernanceProps extends AdminProjectSectionProps {
  owners: AdminProjectUser[];
}

export interface AdminProjectFilesProps extends AdminProjectSectionProps {
  project?: AdminProject;
}

