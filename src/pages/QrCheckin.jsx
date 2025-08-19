// src/pages/QrCheckin.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Spinner, Alert, Button } from "react-bootstrap";
import { api } from "../api/http";
import { useAuth } from "../context/AuthContext";

export default function QrCheckin() {
  // user aún no se usa, pero lo dejamos con _
  const { user: _user } = useAuth();
  const [search] = useSearchParams();

  const initialToken = search.get("t") || search.get("token") || "";
  // setToken no se usa aún → lo marcamos como _setToken
  const [token, _setToken] = useState(initialToken);

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const doCheckin = async (tok) => {
    if (!tok) {
      setErrMsg("Token no válido.");
      return;
    }
    try {
      setLoading(true);
      setErrMsg("");
      setOkMsg("");

      // record no se usa directamente → lo dejamos con _
      const _record = await api("/qr/attendance", {
        method: "POST",
        body: { token: tok },
      });

      setOkMsg("Asistencia registrada ✅");
      setDone(true);
    } catch (e) {
  console.error(e);
  setErrMsg("No se pudo procesar el QR.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) doCheckin(token);
  }, [token]);

  return (
    <Container className="my-5 text-center">
      <h2>Registro de asistencia</h2>
      {loading && <Spinner animation="border" />}
      {okMsg && <Alert variant="success">{okMsg}</Alert>}
      {errMsg && <Alert variant="danger">{errMsg}</Alert>}

      {!done && !loading && (
        <Button onClick={() => doCheckin(token)} disabled={!token}>
          Reintentar
        </Button>
      )}
    </Container>
  );
}





