CREATE VIEW vw_clientes_processos AS
SELECT 
    c.id AS cliente_id,
    c.nome AS cliente_nome,
    p.id AS processo_id,
    p.numero_processo,
    p.descricao AS descrição,
    p.comarca AS comarca,
    p.status AS status
FROM 
    cliente c
INNER JOIN 
    clienteprocesso cp ON c.id = cp.cliente_id
INNER JOIN 
    processo p ON cp.processo_id = p.id;
