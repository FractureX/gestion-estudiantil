# Google AI Studio API Key = AIzaSyCT0e2R7V-Pt3pdUy2Oy6Htm7uQmglN9GQ

from google import genai
client = genai.Client(api_key="AIzaSyCT0e2R7V-Pt3pdUy2Oy6Htm7uQmglN9GQ")

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=f"""Genera 20 pregunta(s) de opción múltiple (MCQ) con 1 pregunta y 3 opciones a partir del siguiente texto: "Las bases de datos son esenciales para almacenar, organizar y gestionar datos de manera eficiente. Permiten a los usuarios recuperar, actualizar y manipular información mediante lenguajes de consulta estructurados como SQL. Existen diferentes tipos de bases de datos, incluidas las bases de datos relacionales como PostgreSQL y MySQL, así como las bases de datos NoSQL como MongoDB. Las aplicaciones modernas dependen de las bases de datos para manejar grandes volúmenes de datos, garantizando seguridad, consistencia y alto rendimiento. Con los avances en la computación en la nube, las bases de datos ahora pueden alojarse de forma remota, proporcionando escalabilidad y accesibilidad desde cualquier parte del mundo." El MCQ debe seguir el siguiente patrón estrictamente:
    1) <Pregunta N>: <Pregunta generada>
    A) <Opción A>
    B) <Opción B>
    C) <Opción C>
    Respuesta: <Opción correcta (A, B o C)>
    """,
)

print(response.text)