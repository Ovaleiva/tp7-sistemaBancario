# Sistema de Eventos Bancarios (modificado) — TP Final
Este proyecto implementa una arquitectura de Microservicios Distribuida para gestionar transacciones, utilizando Next.js para el Front-end y Apache Kafka para la comunicación asíncrona entre servicios. Toda la infraestructura se gestiona mediante Docker Compose.


Tópicos Kafka: txn.commands, txn.events, txn.dlq
Clave de partición: transactionId

⚙️ Requisitos
Asegúrate de tener instalado y ejecutándose Docker Desktop.

▶️ Guía de Inicio Rápido
1. Levantar el Stack Completo
Ejecuta el siguiente comando en la terminal, desde la carpeta raíz del proyecto, para construir y levantar todos los contenedores (frontend, gateway, orchestrator, kafka, etc.):

cd docker

docker-compose up --build -d

2. Inicializar Temas de Kafka (Canales de Comunicación)
Es un paso crítico para asegurar que el sistema de mensajería funcione correctamente. Este script crea los Topics (canales) que los servicios usarán para comunicarse.

Bash

docker-compose run --rm topic-init

3. Acceder a la Aplicación
Una vez que todos los servicios estén listos, puedes acceder a la interfaz de usuario:

👉 URL del Front-end (Next.js): http://localhost:3000

🛠️ Estructura de Docker
El proyecto utiliza múltiples Dockerfiles para aislar cada microservicio:

Dockerfile.frontend: Para la construcción del Front-end de Next.js.

Dockerfile.gateway: Para el microservicio Gateway.

Dockerfile.orchestrator: Para el microservicio Orquestador.

Dockerfile.topic-init: Para ejecutar la inicialización de temas en Kafka.

🔍 Verificación y Diagnóstico
Usa el comando docker ps para ver cuáles servicios están corriendo y confirmar que los contenedores de Gateway, Orquestador, Kafka y Front-end tienen un estatus de Up.

docker ps

TODOS DEBERIAN MOSTAR UP
Si ves alguno en estado Exited (detenido), significa que algo falló al iniciar.

🛑 Cómo Detener y Limpiar
Para detener y eliminar todos los contenedores y redes creadas por Docker Compose:


docker-compose down
