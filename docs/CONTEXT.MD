“Armazenamento em Nuvem Sem Custos: Alternativas Gratuitas aos Buckets do Amazon S3”
Henrriky
Henrriky

Follow
6 min read
·
Dec 3, 2023
6

Esse é o meu primeiro artigo, pessoas a minha volta constantemente diziam que eu deveria escrever alguns artigos aqui no medium ou em qualquer outro site compartilhando o meu conhecimento. Confesso para vocês que não sou muito bom em escrever textos, e que ainda estou no começo da minha carreira de desenvolvedor e que tenho muita coisa para aprender, mas chega de conversa e vamos para o que interessa. Qual é essa alternativa ao Amazon S3?

Configurações iniciais com TEBI
Bom, recentemente eu comecei a desenvolver um projeto pessoal junto com um amigo meu. Nesse projeto precisava armazenar as informações do usuário no banco de dados, mais especificamente a foto de perfil dele. Diante disso, fui buscar soluções que eu poderia utilizar no ambiente desenvolvimento e que fossem gratuitas, pois não tenho muitos recursos para contratar um serviço igual ao da Amazon.

Através dessa curiosidade acabei aprendendo sobre S3 e Buckets. O site que eu encontrei não obriga você a cadastrar um cartão de crédito, ele é extremamente prático, basta se registrar com um email válido e você já terá acesso aos serviços de cloud de graça por um período de 15 dias e claro que de forma limitada. O nome da alternativa é TEBI

O TEBI oferece alguns serviços, como S3, DataStream, FTP e a API deles. Nesse artigo vou ensinar como vocês podem criar um bucket, buscar objetos (nomenclatura adotada para representar imagens, vídeos e outros arquivos) e realizar o upload de arquivos através da API do Tebi.

Acesse esse link para se cadastrar na plataforma deles: <https://client.tebi.io/auth>

Após você realizar o cadastro será necessário confirmar seu e-mail para começar a utilizar os serviços deles. Depois que você ter acesso pleno à conta você vai se deparar com essa interface:

Press enter or click to view image in full size

Aba de keys após realizar o login no TEBI.
A aba que estou mostrando na imagem acima é a de chaves, será através dela que você terá acesso ao seu bucket e poderá realizar uploads de imagens, vídeos ou como diz o jargão utilizado pela Amazon, objetos.

Clique no canto superior direito em “Add Key”, após clicar lá o TEBI vai gerar automaticamente uma chave para você poder utilizar quando for consumir os serviços do TEBI.

Press enter or click to view image in full size

Lista com a nova key adicionada
Nessa seção da imagem acima podemos observar que temos três campos extremamente importantes: Key, Secret e Access Level. A key e o secret são essenciais para você possa realizar uploads ou deletar objetos no TEBI. Já o access level serve para você definir quais são os serviços que aquela chave poderá ter acesso. Se você clicar em editar poderá selecionar quais são os protocolos que você quer permitir.

Press enter or click to view image in full size

Aba de buckets na interface do TEBI
Nessa aba você poderá criar seu bucket, que de forma literal é como se fosse um balde onde você armazena seus objetos, e que posteriormente serão acessados através dos protocolos disponibilizados pelo TEBI, e também da forma que estamos acostumados, que é pela URL. Após acessar essa aba você deve clicar em Add Bucket e criar um nome único que não exista no TEBI.

Press enter or click to view image in full size

Lista de buckets atualizada com o novo Bucket adicionado
Após adicionar o bucket, ele vai aparecer na lista de buckets. Você deve clicar em editar para a gente realizar algumas alterações que serão necessárias para que ele funcione.

Press enter or click to view image in full size

Você pode clicar no botão “Add” no canto superior direito para adicionar uma chave ou associar uma existente ao Bucket, para que posteriormente você possa conseguir acessar ele. Observe na imagem acima que após criar o nosso Bucket você terá as configurações da chave, aonde será possível definir as permissoes aos protocolos do TEBI e as actions disponíveis (Upload, List, Read, Delete), para fins de teste recomendo que você selecione full. Na aba de access control defina todos os protocolos como public

Get Henrriky’s stories in your inbox
Join Medium for free to get updates from this writer.

Enter your email
Subscribe
Não vou entrar no mérito de explicar as outras abas, mas fique a vontade para explorá-las e entender mais a fundo as possibilidades do TEBI.

Enviando e acessando arquivos no TEBI
Press enter or click to view image in full size

Lista de buckets atualizada com o novo Bucket adicionado
Se você voltar para a tela inicial e acessar o bucket que você tinha acabado de criar você poderá clicar em cima do texto do bucket e ele vai te levar para um tela parecida com essa na versão atual:

Press enter or click to view image in full size

Lista de objetos do bucket sem nenhum cadastrado
Aqui você pode enviar uma imagem, após enviar ela você já terá ela na sua lista de objetos:

Press enter or click to view image in full size

Lista de objetos dentro do bucket com a nova imagem adicionada
Agora de forma simples basta você acessar a seguinte URL nesse formato: <https://s3.tebi.io/><NomeDoSeuBucket>/object_name

No nosso caso, teremos uma URL dessa forma para acessar o objeto: <https://s3.tebi.io/bucketdeteste/sla.jpg>

Após acessar a url já teremos nossa imagem sendo exibida

Press enter or click to view image in full size

Enviando arquivos através da API do Tebi (Datastream)
Agora a parte mais legal do nosso artigo, para você poder realizar o upload de imagens para o nosso bucket de forma local será necessário utilizar aquela chave que cadastramos no início do artigo.
De acordo com a documentação devemos ter esse formato

PUT /<KEY> HTTP/1.1
Host: <BUCKET>.datastream.tebi.io
Cache-Control: CacheControl
Content-Disposition: ContentDisposition
Content-Encoding: ContentEncoding
Content-Language: ContentLanguage
Content-Length: ContentLength
Content-MD5: ContentMD5
Content-Type: ContentType
Expires: Expires
x-amz-acl: ACL
x-amz-storage-class: StorageClass
x-amz-upload-availability: UploadAvailability
x-amz-website-redirect-location: WebsiteRedirectLocation
x-amz-server-side-encryption: ServerSideEncryption
x-amz-server-side-encryption-customer-algorithm: SSECustomerAlgorithm
x-amz-server-side-encryption-customer-key: SSECustomerKey
x-amz-server-side-encryption-customer-key-MD5: SSECustomerKeyMD5
As linhas que você deve se preocupar no momento para poder enviar um arquivo são as duas primeiras. Você deverá montar uma URL dessa forma:

Tipo do método: PUT
Host: https://<nomedobucket>.datastream.teb.io
Header obrigatório: Authorization
A estrutura do header deve estar da seguinte forma:

Authorization:TB-PLAIN <Key>:<Secret>
Você deverá colocar dessa exata forma passando a Key e o Secret da chave criada anteriormente e que foi associada ao seu bucket.

Nesse artigo foi utilizar o Postman para realizar o upload, mas fique à vontade para usar quaisquer outro software parecido, ou até mesmo enviar através da sua linguagem preferida!

Press enter or click to view image in full size

Postman com a configuração para a realizar upload via Datastream
Agora basta selecionar o body do tipo “binary” e selecionar um arquivo. Após clicar em enviar você terá seus dados de retorno:

Press enter or click to view image in full size

Resposta após o envio da imagem
Depois de enviar a imagem ele irá retornar o nome do seu objeto que foi criado automáticamente. Agora podemos ir no nosso bucket e já teremos acesso ao objeto criado:

Press enter or click to view image in full size

Bom pessoal, espero que esse conteúdo de alguma forma seja útil para vocês, esse é meu primeiro artigo como havia citado no começo. Então se você tiver alguma sugestão de pontos de melhoria ou alguma dúvida estou a disposição para te ouvir. Até o proximo artigo!
