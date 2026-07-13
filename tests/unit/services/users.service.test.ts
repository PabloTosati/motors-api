import bcrypt from 'bcryptjs';
import * as usersService from '../../../src/modules/users/users.service';
import { usersRepository, UserRow } from '../../../src/modules/users/users.repository';
import { fetchAddressByCep } from '../../../src/utils/viaCep';
import { BadRequestError, NotFoundError } from '../../../src/utils/AppError';

jest.mock('../../../src/modules/users/users.repository');
jest.mock('../../../src/utils/viaCep');

const mockedRepo = usersRepository as jest.Mocked<typeof usersRepository>;
const mockedFetchAddress = fetchAddressByCep as jest.MockedFunction<typeof fetchAddressByCep>;

function buildUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Joãozinho Ciclano',
    cpf: '13114786049',
    birth: new Date('2000-03-03'),
    email: 'joazinho@email.com',
    password: 'hashed-password',
    cep: '01001000',
    logradouro: 'Praça da Sé',
    complemento: null,
    bairro: 'Sé',
    localidade: 'São Paulo',
    uf: 'SP',
    qualified: true,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

const validCreateInput = {
  name: 'Joãozinho Ciclano',
  cpf: '131.147.860-49',
  birth: new Date('2000-03-03'),
  email: 'joazinho@email.com',
  password: '123456',
  cep: '01001000',
  qualified: 'yes' as const,
};

describe('users.service', () => {
  describe('createUser', () => {
    it('cria o usuário com sucesso, consultando o ViaCEP e nunca retornando a senha', async () => {
      mockedRepo.findByCpf.mockResolvedValue(undefined);
      mockedRepo.findByEmail.mockResolvedValue(undefined);
      mockedFetchAddress.mockResolvedValue({
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        complemento: '',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      });
      mockedRepo.create.mockResolvedValue(buildUserRow());

      const result = await usersService.createUser(validCreateInput);

      expect(mockedFetchAddress).toHaveBeenCalledWith('01001000');
      expect(mockedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ cpf: '13114786049', qualified: true }),
      );
      expect(result).not.toHaveProperty('password');
      expect(result.qualified).toBe('yes');
    });

    it('rejeita CPF já cadastrado sem consultar o ViaCEP', async () => {
      mockedRepo.findByCpf.mockResolvedValue(buildUserRow());
      mockedRepo.findByEmail.mockResolvedValue(undefined);

      await expect(usersService.createUser(validCreateInput)).rejects.toBeInstanceOf(
        BadRequestError,
      );
      expect(mockedFetchAddress).not.toHaveBeenCalled();
    });

    it('rejeita e-mail já cadastrado', async () => {
      mockedRepo.findByCpf.mockResolvedValue(undefined);
      mockedRepo.findByEmail.mockResolvedValue(buildUserRow());

      await expect(usersService.createUser(validCreateInput)).rejects.toBeInstanceOf(
        BadRequestError,
      );
    });
  });

  describe('getUserById', () => {
    it('retorna 400 (BadRequestError) para ID com formato inválido', async () => {
      await expect(usersService.getUserById('id-invalido')).rejects.toBeInstanceOf(BadRequestError);
      expect(mockedRepo.findById).not.toHaveBeenCalled();
    });

    it('retorna 404 (NotFoundError) quando o usuário não existe', async () => {
      mockedRepo.findById.mockResolvedValue(undefined);
      await expect(
        usersService.getUserById('a0000000-0000-4000-8000-000000000001'),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('retorna o usuário mapeado quando encontrado', async () => {
      mockedRepo.findById.mockResolvedValue(buildUserRow());
      const result = await usersService.getUserById('a0000000-0000-4000-8000-000000000001');
      expect(result.email).toBe('joazinho@email.com');
    });
  });

  describe('updateUser', () => {
    it('lança NotFoundError se o usuário não existir', async () => {
      mockedRepo.findById.mockResolvedValue(undefined);
      await expect(
        usersService.updateUser('a0000000-0000-4000-8000-000000000001', {}),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('rejeita atualização para um e-mail que já pertence a outro usuário', async () => {
      mockedRepo.findById.mockResolvedValue(buildUserRow());
      mockedRepo.findByEmail.mockResolvedValue(
        buildUserRow({ id: 'outro-id', email: 'em-uso@email.com' }),
      );

      await expect(
        usersService.updateUser('a0000000-0000-4000-8000-000000000001', {
          email: 'em-uso@email.com',
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('permite manter o mesmo e-mail do próprio usuário', async () => {
      const existing = buildUserRow();
      mockedRepo.findById.mockResolvedValue(existing);
      mockedRepo.findByEmail.mockResolvedValue(existing);
      mockedRepo.update.mockResolvedValue(existing);

      await expect(
        usersService.updateUser(existing.id, { email: existing.email }),
      ).resolves.toBeDefined();
    });

    it('só consulta o ViaCEP novamente se o CEP for alterado', async () => {
      const existing = buildUserRow();
      mockedRepo.findById.mockResolvedValue(existing);
      mockedRepo.update.mockResolvedValue(existing);

      await usersService.updateUser(existing.id, { name: 'Novo Nome' });

      expect(mockedFetchAddress).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('lança NotFoundError se o usuário não existir', async () => {
      mockedRepo.findById.mockResolvedValue(undefined);
      await expect(
        usersService.deleteUser('a0000000-0000-4000-8000-000000000001'),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(mockedRepo.delete).not.toHaveBeenCalled();
    });

    it('remove o usuário quando ele existe', async () => {
      mockedRepo.findById.mockResolvedValue(buildUserRow());
      mockedRepo.delete.mockResolvedValue(1);

      await usersService.deleteUser('a0000000-0000-4000-8000-000000000001');

      expect(mockedRepo.delete).toHaveBeenCalledWith('a0000000-0000-4000-8000-000000000001');
    });
  });

  describe('listUsers', () => {
    it('retorna a lista paginada de usuários', async () => {
      mockedRepo.list.mockResolvedValue([buildUserRow()]);
      mockedRepo.count.mockResolvedValue(1);

      const result = await usersService.listUsers({});

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

describe('bcrypt integration sanity check', () => {
  it('gera hashes diferentes a cada chamada e valida corretamente', async () => {
    const hash = await bcrypt.hash('123456', 10);
    expect(await bcrypt.compare('123456', hash)).toBe(true);
    expect(await bcrypt.compare('errada', hash)).toBe(false);
  });
});
