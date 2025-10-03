using WhatsApp.Core.Models;

namespace WhatsApp.Infrastructure.Services;

/// <summary>
/// Serviço que fornece templates pré-configurados de agentes de IA
/// </summary>
public class AIAgentTemplateService
{
    /// <summary>
    /// Obtém todos os templates disponíveis
    /// </summary>
    public List<AIAgentTemplate> GetAllTemplates()
    {
        return new List<AIAgentTemplate>
        {
            new AIAgentTemplate
            {
                Id = "atendimento_geral",
                Name = "Atendimento Geral",
                Type = "atendimento",
                Description = "Agente para atendimento ao cliente com perguntas frequentes",
                Icon = "🤝",
                Configuration = new
                {
                    greeting = "Olá! Sou o assistente de atendimento. Como posso ajudá-lo hoje?",
                    model = "gpt-3.5-turbo",
                    temperature = 0.7,
                    max_tokens = 150,
                    system_prompt = "Você é um assistente de atendimento ao cliente. Seja educado, prestativo e direto nas respostas."
                },
                UseCases = new[]
                {
                    "Responder perguntas frequentes",
                    "Direcionar clientes para departamentos",
                    "Fornecer informações sobre produtos/serviços"
                }
            },
            new AIAgentTemplate
            {
                Id = "vendas",
                Name = "Assistente de Vendas",
                Type = "vendas",
                Description = "Agente especializado em vendas e apresentação de produtos",
                Icon = "💰",
                Configuration = new
                {
                    greeting = "Olá! Estou aqui para ajudá-lo a encontrar o produto perfeito. O que você está procurando?",
                    model = "gpt-3.5-turbo",
                    temperature = 0.8,
                    max_tokens = 200,
                    system_prompt = "Você é um vendedor experiente. Foque em entender as necessidades do cliente e apresentar soluções que se adequem. Seja persuasivo mas não invasivo."
                },
                UseCases = new[]
                {
                    "Apresentar produtos e serviços",
                    "Identificar necessidades do cliente",
                    "Fechar vendas e negociações",
                    "Fornecer informações sobre preços e condições"
                }
            },
            new AIAgentTemplate
            {
                Id = "suporte_tecnico",
                Name = "Suporte Técnico",
                Type = "suporte",
                Description = "Agente para resolução de problemas técnicos",
                Icon = "🔧",
                Configuration = new
                {
                    greeting = "Olá! Sou o suporte técnico. Por favor, descreva o problema que você está enfrentando.",
                    model = "gpt-4",
                    temperature = 0.5,
                    max_tokens = 300,
                    system_prompt = "Você é um especialista em suporte técnico. Faça perguntas específicas para diagnosticar problemas. Forneça soluções passo a passo de forma clara."
                },
                UseCases = new[]
                {
                    "Diagnosticar problemas técnicos",
                    "Fornecer soluções passo a passo",
                    "Escalar tickets complexos",
                    "Documentar incidentes"
                }
            },
            new AIAgentTemplate
            {
                Id = "agendamento",
                Name = "Agendamento de Consultas",
                Type = "agendamento",
                Description = "Agente para marcar e gerenciar agendamentos",
                Icon = "📅",
                Configuration = new
                {
                    greeting = "Olá! Posso ajudá-lo a agendar uma consulta. Qual data e horário você prefere?",
                    model = "gpt-3.5-turbo",
                    temperature = 0.6,
                    max_tokens = 150,
                    system_prompt = "Você é um assistente de agendamento. Colete informações necessárias: data, horário, tipo de serviço e dados de contato. Confirme sempre os detalhes antes de finalizar."
                },
                UseCases = new[]
                {
                    "Agendar consultas e compromissos",
                    "Verificar disponibilidade",
                    "Reagendar ou cancelar",
                    "Enviar lembretes"
                }
            },
            new AIAgentTemplate
            {
                Id = "cobranca",
                Name = "Assistente Financeiro",
                Type = "cobranca",
                Description = "Agente para cobranças e questões financeiras",
                Icon = "💳",
                Configuration = new
                {
                    greeting = "Olá! Posso ajudá-lo com questões sobre pagamentos e faturas. Em que posso auxiliar?",
                    model = "gpt-3.5-turbo",
                    temperature = 0.5,
                    max_tokens = 150,
                    system_prompt = "Você é um assistente financeiro. Seja profissional ao tratar de cobranças. Forneça informações sobre pagamentos, faturas e opções de parcelamento."
                },
                UseCases = new[]
                {
                    "Enviar lembretes de pagamento",
                    "Informar sobre faturas vencidas",
                    "Negociar condições de pagamento",
                    "Fornecer segunda via de boletos"
                }
            },
            new AIAgentTemplate
            {
                Id = "feedback",
                Name = "Coletor de Feedback",
                Type = "feedback",
                Description = "Agente para coletar avaliações e feedbacks",
                Icon = "⭐",
                Configuration = new
                {
                    greeting = "Olá! Gostaríamos de saber sua opinião sobre nosso atendimento. Como foi sua experiência?",
                    model = "gpt-3.5-turbo",
                    temperature = 0.7,
                    max_tokens = 100,
                    system_prompt = "Você é um coletor de feedback. Faça perguntas sobre a experiência do cliente, seja empático com críticas e agradeça por elogios. Colete informações específicas."
                },
                UseCases = new[]
                {
                    "Coletar avaliações pós-atendimento",
                    "Medir satisfação do cliente",
                    "Identificar pontos de melhoria",
                    "Registrar reclamações e elogios"
                }
            },
            new AIAgentTemplate
            {
                Id = "faq",
                Name = "Perguntas Frequentes",
                Type = "faq",
                Description = "Agente com respostas pré-definidas para perguntas comuns",
                Icon = "❓",
                Configuration = new
                {
                    greeting = "Olá! Tenho respostas para as perguntas mais comuns. O que você gostaria de saber?",
                    model = "gpt-3.5-turbo",
                    temperature = 0.3,
                    max_tokens = 120,
                    system_prompt = "Você tem acesso a uma base de conhecimento de perguntas frequentes. Forneça respostas precisas e consistentes. Se não souber a resposta, direcione para atendimento humano."
                },
                UseCases = new[]
                {
                    "Responder perguntas frequentes",
                    "Fornecer informações sobre horários e localização",
                    "Explicar políticas e procedimentos",
                    "Direcionar para recursos específicos"
                }
            },
            new AIAgentTemplate
            {
                Id = "multilingual",
                Name = "Atendimento Multilíngue",
                Type = "atendimento",
                Description = "Agente que atende em múltiplos idiomas",
                Icon = "🌍",
                Configuration = new
                {
                    greeting = "Hello! Olá! Hola! How can I help you? / Como posso ajudá-lo?",
                    model = "gpt-4",
                    temperature = 0.7,
                    max_tokens = 150,
                    supported_languages = new[] { "pt", "en", "es", "fr" },
                    system_prompt = "Você é um assistente multilíngue. Detecte o idioma do cliente e responda no mesmo idioma. Seja natural e culturalmente apropriado."
                },
                UseCases = new[]
                {
                    "Atender clientes internacionais",
                    "Traduzir informações automaticamente",
                    "Adaptar respostas culturalmente",
                    "Expandir mercado global"
                }
            }
        };
    }

    /// <summary>
    /// Obtém um template específico por ID
    /// </summary>
    public AIAgentTemplate? GetTemplateById(string templateId)
    {
        return GetAllTemplates().FirstOrDefault(t => t.Id == templateId);
    }

    /// <summary>
    /// Obtém templates por tipo
    /// </summary>
    public List<AIAgentTemplate> GetTemplatesByType(string type)
    {
        return GetAllTemplates().Where(t => t.Type.Equals(type, StringComparison.OrdinalIgnoreCase)).ToList();
    }
}
