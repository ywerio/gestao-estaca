export const INDICATORS = [
  { key: 'Frequência sacramental', group: 'VIVER', baseline: 611 },
  { key: 'Membros participantes', group: 'VIVER', baseline: 803 },
  { key: 'Membros retornando', group: 'CUIDAR', baseline: 2955 },
  { key: 'Membros jejuando', group: 'CUIDAR', baseline: 78 },
  { key: 'Batismos de conversos', group: 'CONVIDAR', baseline: 112 },
  { key: 'Missionários do Brasil', group: 'CONVIDAR', baseline: 28 },
  { key: 'Recomendações do templo com investidura', group: 'UNIR', baseline: 214 },
  { key: 'Recomendações do templo sem investidura', group: 'UNIR', baseline: 141 }
];
export const GOALS = {
  'Altos': {2026:[105,105,36,55,36,9,35,50],2027:[115,115,39,60,39,10,38,55]},
  'Cidade Leste': {2026:[120,96,20,50,32,4,40,30],2027:[130,100,20,60,32,6,45,35]},
  'Satélite': {2026:[80,85,20,25,20,2,40,25],2027:[100,100,20,30,20,5,45,30]},
  'Dom Pedro II': {2026:[105,105,23,65,21,6,37,45],2027:[131,131,29,81,26,8,46,56]},
  'Horto': {2026:[75,70,20,15,10,3,25,10],2027:[85,80,25,20,15,5,30,15]},
  'Piçarreira': {2026:[130,120,30,30,24,14,25,45],2027:[145,140,45,50,40,12,30,50]},
  'Taquari': {2026:[130,80,10,70,10,5,70,30],2027:[140,90,15,80,15,10,80,40]},
  'Uruguai': {2026:[100,130,24,60,15,6,40,40],2027:[115,145,24,70,18,7,45,60]}
};
export const CHURCH_EVENTS_2027 = [
  ['2027-01-16','“Alegrar-se em Cristo” — recurso mundial para os jovens','Vídeo disponível para uso em reuniões, atividades e devocionais.'],
  ['2027-02-07','Devocional Mundial para os Jovens Adultos','Transmissão mundial para jovens adultos.'],
  ['2027-03-04','Instrução sobre templo e história da família para a liderança','Recurso de treinamento disponível para conselhos e líderes.'],
  ['2027-03-04','RootsTech 2027','Evento mundial de história da família, de 4 a 6 de março.'],
  ['2027-03-06','Dia de Descoberta Familiar','Transmissão mundial sobre descoberta familiar.'],
  ['2027-03-06','Devocional Mundial da Sociedade de Socorro','Recurso mundial disponível para as mulheres.'],
  ['2027-03-21','Início da Semana Santa — Domingo de Ramos','Período de preparação para a Páscoa, de 21 a 28 de março.'],
  ['2027-03-28','Domingo de Páscoa','Celebração da Ressurreição de Jesus Cristo.'],
  ['2027-04-03','Conferência Geral — sessões de sábado','Conferência Geral em 3 e 4 de abril.'],
  ['2027-04-04','Conferência Geral — sessões de domingo','Conferência Geral em 3 e 4 de abril.'],
  ['2027-04-05','Comemoração do Templo de Salt Lake','Programação presencial e virtual de 5 de abril a 1º de outubro.'],
  ['2027-05-02','Devocional Mundial para os Jovens Adultos','Transmissão mundial para jovens adultos.'],
  ['2027-05-22','Vídeo De Amigo para Amigo — Primária','Recurso mundial para crianças e líderes da Primária.'],
  ['2027-06-10','Conferência de Educadores Religiosos','Transmissão em 10 e 11 de junho.'],
  ['2027-06-11','Conferência de Educadores Religiosos','Transmissão em 10 e 11 de junho.'],
  ['2027-09-04','Vídeo De Amigo para Amigo — Primária','Recurso mundial para crianças e líderes da Primária.'],
  ['2027-10-01','Encerramento da comemoração do Templo de Salt Lake','Evento mundial de encerramento.'],
  ['2027-10-02','Conferência Geral — sessões de sábado','Conferência Geral em 2 e 3 de outubro.'],
  ['2027-10-03','Conferência Geral — sessões de domingo','Conferência Geral em 2 e 3 de outubro.'],
  ['2027-11-07','Devocional Mundial para os Jovens Adultos','Transmissão mundial para jovens adultos.'],
  ['2027-12-05','Devocional de Natal da Primeira Presidência','Transmissão mundial de Natal.'],
  ['2027-12-19','Reunião sacramental especial de Natal — data sugerida','As alas podem realizar a reunião especial em 19 ou 26 de dezembro.'],
  ['2027-12-26','Reunião sacramental especial de Natal — data alternativa','As alas podem realizar a reunião especial em 19 ou 26 de dezembro.']
].map(([event_date,title,description])=>({event_date,title,description,unit_type:'geral',ward_name:null,location:'Transmissão mundial / Igreja'}));
