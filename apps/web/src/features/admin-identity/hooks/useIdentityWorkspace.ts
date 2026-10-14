import { useState } from 'react';
import type { AdminUser, GroupInput } from '@helpdesk/contracts';
import { useIdentity } from './useIdentity';

export function useIdentityWorkspace() {
  const identity = useIdentity(); const [tab, setTab] = useState<'users' | 'groups'>('users');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null); const [creatingUser, setCreatingUser] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<(GroupInput & { idGrupo: number }) | null>(null); const [creatingGroup, setCreatingGroup] = useState(false);
  const user = identity.users.data?.data.find((u) => u.idUsuario === selectedUser?.idUsuario) ?? selectedUser;
  const group = identity.groups.data?.data.find((g) => g.idGrupo === selectedGroup?.idGrupo) ?? selectedGroup;
  const chooseUser = (value: AdminUser) => { setSelectedUser(value); setCreatingUser(false); };
  const chooseGroup = (value: GroupInput & { idGrupo: number }) => { setSelectedGroup(value); setCreatingGroup(false); };
  return { ...identity, tab: identity.canUsers ? tab : 'groups', setTab, user, group, creatingUser, creatingGroup, chooseUser, chooseGroup,
    newUser: () => { setCreatingUser(true); setSelectedUser(null); }, newGroup: () => { setCreatingGroup(true); setSelectedGroup(null); } };
}
