# Check maven version
MVN_VERSION=$(mvn -v | grep "Apache Maven" | cut -d ' ' -f 3)
MVN_MAJOR_VERSION=$(echo "${MVN_VERSION}" | cut -d '.' -f 1)
if [ ! "${MVN_MAJOR_VERSION}" == "3" ]
then
	echo "Versione di Maven non supporta, utilizzare la versione 3 per il deploy! (versione '${MVN_MAJOR_VERSION}' trovata: ${MVN_VERSION})"
        echo "NOTA: in caso di errore durante l'upload 'Cannot access scpexe.....WagonTransporterFactory....' aggiungere in $M2_HOME/lib/ext i jar wagon-ssh-common-3.3.4.jar e wagon-ssh-external-3.3.4.jar"
	exit 1
fi

JAR_FILE=$1
JAR_NAME=$(basename ${JAR_FILE})
ARTIFACT_ID=$2
GROUP_ID=$3
MVN_VERSION=$4


if [ -z "${JAR_NAME}" ]
then
	echo "JarName non fornito"
	exit 1
fi
if [ -z "${ARTIFACT_ID}" ]
then
	echo "ArtifactId non fornito"
	exit 1
fi
if [ -z "${GROUP_ID}" ]
then
	echo "GroupId non fornito"
	exit 1
fi
if [ -z "${MVN_VERSION}" ]
then
	echo "MnvVersion non fornito"
	exit 1
fi

TIPO="snapshot"
if [ ! -z "$5" ]
then
	if [ "snapshot" == "$5" ]
	then
	        TIPO="snapshot"
	fi
	if [ "release" == "$5" ]
	then
	        TIPO="release"
	fi
fi

PREFIX_URL="scpexe://poli-dev/opt/local/maven"
SNAPSHOT_SUFFIX=""

if [ "release" == "$TIPO" ]
then
	URL_REPOSITORY="${PREFIX_URL}/public"
fi
if [ "snapshot" == "$TIPO" ]
then
        SNAPSHOT_SUFFIX="-SNAPSHOT"
        URL_REPOSITORY="${PREFIX_URL}/snapshots"
fi

rm -rf TMP_MAVEN_DEPLOY
mkdir TMP_MAVEN_DEPLOY

echo "Deploy del JAR $JAR_NAME in corso..."

echo "<project xmlns=\"http://maven.apache.org/POM/4.0.0\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"
        xsi:schemaLocation=\"http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd\">
        <artifactId>${ARTIFACT_ID}</artifactId>
	<groupId>${GROUP_ID}</groupId>
	<version>${MVN_VERSION}${SNAPSHOT_SUFFIX}</version>
	<modelVersion>4.0.0</modelVersion>
        <name>${JAR_NAME}</name>
</project>" > "TMP_MAVEN_DEPLOY/${JAR_NAME}.pom"

mvn deploy:deploy-file -DrepositoryId=link-repository -DpomFile=TMP_MAVEN_DEPLOY/${JAR_NAME}.pom -Dfile=${JAR_FILE} -Durl=$URL_REPOSITORY
#cat TMP_MAVEN_DEPLOY/${JAR_NAME}.pom

echo "Deploy del JAR $JAR_NAME completato."

rm -rf TMP_MAVEN_DEPLOY
