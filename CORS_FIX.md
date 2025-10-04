# Correção de Erro CORS

## Problema

O navegador está bloqueando as requisições do frontend (`http://localhost:3000`) para o backend (`http://localhost:5278`) devido à política CORS (Cross-Origin Resource Sharing).

```
Access to XMLHttpRequest at 'http://localhost:5278/api/v1/...' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solução no Backend (.NET)

### Opção 1: Configurar CORS no `Program.cs` (Recomendado)

Abra o arquivo `backend/src/WhatsApp.API/Program.cs` e adicione a configuração CORS:

```csharp
var builder = WebApplication.CreateBuilder(args);

// ... outras configurações ...

// Adicione esta seção ANTES de builder.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // URL do frontend
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ... outras configurações ...

// Adicione DEPOIS de app.Build() e ANTES de app.UseAuthentication()
app.UseCors("AllowFrontend");

// app.UseAuthentication();
// app.UseAuthorization();
// app.MapControllers();
```

### Opção 2: CORS Permissivo (Apenas para Desenvolvimento)

Se você quer permitir qualquer origem durante o desenvolvimento:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ...

app.UseCors("AllowAll");
```

⚠️ **ATENÇÃO**: A Opção 2 não deve ser usada em produção!

### Ordem de Middlewares no `Program.cs`

É MUITO importante que o middleware CORS esteja na ordem correta:

```csharp
var app = builder.Build();

// 1. HTTPS Redirection (opcional)
app.UseHttpsRedirection();

// 2. Static Files (se tiver)
// app.UseStaticFiles();

// 3. Routing
app.UseRouting();

// 4. CORS - DEVE VIR ANTES DE Authentication/Authorization
app.UseCors("AllowFrontend");

// 5. Authentication
app.UseAuthentication();

// 6. Authorization
app.UseAuthorization();

// 7. Endpoints
app.MapControllers();
```

## Verificação

Após configurar CORS no backend:

1. **Reinicie o backend**:
   ```bash
   # Pare o servidor (Ctrl+C)
   cd backend/src/WhatsApp.API
   dotnet run --urls "http://localhost:5278"
   ```

2. **Verifique os headers da resposta**:
   - Abra o DevTools (F12)
   - Vá para a aba Network
   - Faça uma requisição
   - Verifique se o header `Access-Control-Allow-Origin` está presente

3. **Teste no frontend**:
   - Acesse http://localhost:3000/conversations
   - Selecione um contato
   - Verifique se as mensagens carregam sem erro CORS

## Exemplo Completo de `Program.cs`

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* ... */ });

// CORS - Adicionar aqui
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();

// CORS - Deve vir ANTES de Authentication
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

## Troubleshooting

### Erro continua após configurar CORS

1. **Verifique a ordem dos middlewares** - CORS deve vir ANTES de Authentication
2. **Reinicie o backend** - Alterações no Program.cs requerem restart
3. **Limpe o cache do navegador** - Pressione Ctrl+Shift+Delete

### Erro apenas em algumas rotas

- Verifique se há atributos `[EnableCors]` ou `[DisableCors]` nos controllers
- Remova esses atributos para usar a política global

### Erro em requisições OPTIONS (Preflight)

- O navegador envia uma requisição OPTIONS antes da requisição real
- Certifique-se de que `.AllowAnyMethod()` está configurado
- Verifique se não há middleware bloqueando requisições OPTIONS

## Configuração para Produção

Em produção, use origens específicas:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Production", policy =>
    {
        policy.WithOrigins(
                "https://seu-dominio.com",
                "https://www.seu-dominio.com"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

Ou leia de configuração:

```csharp
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Production", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

`appsettings.json`:
```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://seu-dominio.com",
      "https://www.seu-dominio.com"
    ]
  }
}
```
