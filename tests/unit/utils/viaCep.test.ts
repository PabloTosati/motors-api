import axios from 'axios';
import { fetchAddressByCep } from '../../../src/utils/viaCep';
import { BadRequestError } from '../../../src/utils/AppError';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('fetchAddressByCep', () => {
  it('retorna apenas os campos até "uf" (conforme especificado no desafio)', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        cep: '01001-000',
        logradouro: 'Praça da Sé',
        complemento: 'lado ímpar',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
        ibge: '3550308',
        gia: '1004',
        ddd: '11',
        siafi: '7107',
      },
    });

    const address = await fetchAddressByCep('01001000');

    expect(address).toEqual({
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      complemento: 'lado ímpar',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
    });
    expect(address).not.toHaveProperty('ibge');
    expect(mockedAxios.get).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/');
  });

  it('rejeita CEP com formato inválido sem chamar a API', async () => {
    await expect(fetchAddressByCep('123')).rejects.toBeInstanceOf(BadRequestError);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('lança erro quando o ViaCEP retorna "erro: true" (CEP inexistente)', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { erro: true } });
    await expect(fetchAddressByCep('00000000')).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança erro tratado quando a chamada à API falha (ex: sem conexão)', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    await expect(fetchAddressByCep('01001000')).rejects.toBeInstanceOf(BadRequestError);
  });
});
