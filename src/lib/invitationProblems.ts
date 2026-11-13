/**
 * What the invitee reads when an invitation can't be used (pt-BR). Shared by
 * the accept route and the invite page, so both say the same thing. Each case
 * says what to do next, since "expired" and "already used" need different
 * actions.
 */
export const INVITATION_PROBLEM_MESSAGES = {
  not_found: {
    title: "Não encontramos este convite",
    text: "O link pode ter sido copiado pela metade. Confira se ele está completo ou peça um novo para quem convidou você.",
  },
  expired: {
    title: "Este convite expirou",
    text: "Convites valem por 7 dias. Peça um novo para a pessoa administradora.",
  },
  revoked: {
    title: "Este convite foi cancelado",
    text: "A pessoa administradora cancelou este link ou enviou um mais novo. Use o convite mais recente ou peça outro.",
  },
  accepted: {
    title: "Este convite já foi usado",
    text: "A conta já foi criada com este link. Entre pela tela de login com o seu e-mail e senha.",
  },
  already_has_account: {
    title: "Este e-mail já tem uma conta",
    text: "Entre pela tela de login. Se não conseguir acessar, fale com a pessoa administradora.",
  },
  auth_account_exists: {
    title: "Já existe um login com este e-mail",
    text: "Não foi possível criar a conta porque este e-mail já está cadastrado no login. Fale com a pessoa administradora.",
  },
  weak_password: {
    title: "Senha fraca",
    text: "Essa senha é fácil de adivinhar. Use uma mais longa, misturando letras, números e símbolos.",
  },
} as const;

export type InvitationProblem = keyof typeof INVITATION_PROBLEM_MESSAGES;
