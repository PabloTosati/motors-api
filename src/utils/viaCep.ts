import axios from 'axios';
import { BadRequestError } from './AppError';

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
}

interface ViaCepRawResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Busca o endereço de um CEP na API ViaCEP.
 * Considera apenas os dados retornados até o campo "uf", conforme
 * especificado no desafio (ibge/gia/ddd/siafi são descartados).
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress> {
  const normalized = cep.replace(/\D/g, '');

  if (normalized.length !== 8) {
    throw new BadRequestError('cep inválido');
  }

  let data: ViaCepRawResponse;

  try {
    const response = await axios.get<ViaCepRawResponse>(
      `https://viacep.com.br/ws/${normalized}/json/`,
    );
    data = response.data;
  } catch {
    throw new BadRequestError('não foi possível consultar o CEP informado');
  }

  if (!data || data.erro) {
    throw new BadRequestError('cep não encontrado');
  }

  const { cep: returnedCep, logradouro, complemento, bairro, localidade, uf } = data;

  return {
    cep: returnedCep ?? normalized,
    logradouro: logradouro ?? '',
    complemento: complemento ?? '',
    bairro: bairro ?? '',
    localidade: localidade ?? '',
    uf: uf ?? '',
  };
}
