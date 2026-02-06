from flask import Blueprint, request, jsonify
from extensions import db
from api.auth.decorators import jwt_required
from api.models.user import User
from api.models.estabelecimento import Estabelecimento
from api.models.horarioFuncionamento import HorarioFuncionamento


horario_bp = Blueprint(
    "horario_funcionamento",
    __name__,
    url_prefix="/empresa"
)

@horario_bp.route("/horarios", methods=["POST"])
@jwt_required
def salvar_horarios():
    user_id = request.user_id

    user = User.query.get(user_id)
    if not user or user.tipo_usuario != "empresa":
        return jsonify({"error": "Acesso não autorizado"}), 403

    estabelecimento = Estabelecimento.query.filter_by(
        pessoa_id=user.pessoa_id
    ).first()

    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404

    dados = request.get_json()

    if not isinstance(dados, list):
        return jsonify({"error": "Formato inválido"}), 400

    # remove horários antigos
    HorarioFuncionamento.query.filter_by(
        estabelecimento_id=estabelecimento.id
    ).delete()

    for h in dados:
        ativo = h.get("ativo", False)

        # 👉 validação de segurança
        if ativo and (not h.get("hora_inicio") or not h.get("hora_fim")):
            db.session.rollback()
            return jsonify({
                "error": "Horário inválido para dia ativo"
            }), 400

        # ignora dias fechados
        if not ativo:
            continue

        horario = HorarioFuncionamento(
            estabelecimento_id=estabelecimento.id,
            dia_semana=h.get("dia_semana"),
            hora_inicio=h.get("hora_inicio"),
            hora_fim=h.get("hora_fim"),
            ativo=True
        )

        db.session.add(horario)

    try:
        db.session.commit()
        return jsonify({"message": "Horários salvos com sucesso"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Erro ao salvar horários",
            "details": str(e)
        }), 500



@horario_bp.route("/horarios", methods=["GET"])
@jwt_required
def listar_horarios():
    user_id = request.user_id

    user = User.query.get(user_id)
    if not user or user.tipo_usuario != "empresa":
        return jsonify({"error": "Acesso não autorizado"}), 403

    estabelecimento = Estabelecimento.query.filter_by(
        pessoa_id=user.pessoa_id
    ).first()

    if not estabelecimento:
        return jsonify({"error": "Estabelecimento não encontrado"}), 404

    horarios = HorarioFuncionamento.query.filter_by(
        estabelecimento_id=estabelecimento.id
    ).all()

    return jsonify([
        {
            "dia_semana": h.dia_semana,
            "hora_inicio": h.hora_inicio,
            "hora_fim": h.hora_fim,
            "ativo": h.ativo
        }
        for h in horarios
    ]), 200
