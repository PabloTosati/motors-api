import bcrypt from 'bcryptjs';
import * as authService from '../../../src/modules/auth/auth.service';
import * as usersServiceModule from '../../../src/modules/users/users.service';
import { BadRequestError } from '../../../src/utils/AppError';

jest.mock('../../../src/modules/users/users.service');

const mockedFindUserByEmail = usersServiceModule.findUserByEmailInternal as jest.MockedFunction<
  typeof usersServiceModule.findUserByEmailInternal
>;

describe('auth.service login', () => {
  it('retorna um token JWT quando as credenciais são válidas', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    mockedFindUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'joazinho@email.com',
      password: hashedPassword,
    } as never);

    const result = await authService.login({ email: 'joazinho@email.com', password: '123456' });

    expect(result.token).toEqual(expect.any(String));
    expect(result.token.split('.')).toHaveLength(3);
  });

  it('rejeita quando o e-mail não está cadastrado', async () => {
    mockedFindUserByEmail.mockResolvedValue(undefined);

    await expect(
      authService.login({ email: 'inexistente@email.com', password: '123456' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita quando a senha está incorreta', async () => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    mockedFindUserByEmail.mockResolvedValue({
      id: 'u1',
      email: 'joazinho@email.com',
      password: hashedPassword,
    } as never);

    await expect(
      authService.login({ email: 'joazinho@email.com', password: 'errada' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
