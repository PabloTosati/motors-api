import { UserRow } from './users.repository';
import { formatBrDate } from '../../utils/dateUtils';
import { formatCpf } from '../../utils/cpf';

export interface UserResponse {
  id: string;
  name: string;
  cpf: string;
  birth: string;
  email: string;
  cep: string;
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  localidade: string | null;
  uf: string | null;
  qualified: 'yes' | 'no';
  createdAt: Date;
  updatedAt: Date;
}

/** Nunca inclui o hash da senha na resposta da API. */
export function toUserResponse(user: UserRow): UserResponse {
  return {
    id: user.id,
    name: user.name,
    cpf: formatCpf(user.cpf),
    birth: formatBrDate(new Date(user.birth)),
    email: user.email,
    cep: user.cep,
    logradouro: user.logradouro,
    complemento: user.complemento,
    bairro: user.bairro,
    localidade: user.localidade,
    uf: user.uf,
    qualified: user.qualified ? 'yes' : 'no',
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
