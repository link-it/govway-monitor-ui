RELEASE=$1
if [ -z "${RELEASE}" ]
then
	echo "Tipo di build non fornito"
	echo "Error; usage: ./build.sh snapshot|release [upload:true/false]"
	exit 2
fi
if [ ! "snapshot" == "${RELEASE}" -a ! "release" == "${RELEASE}" ]
then
	echo "Tipo di build '${RELEASE}' sconosciuto"
	echo "Error; usage: ./build.sh snapshot|release [upload:true/false]"
	exit 3
fi

UPLOAD=$2
if [ -z "${UPLOAD}" ]
then
	UPLOAD=false
fi
if [ ! "${UPLOAD}" == "true" -a ! "${UPLOAD}" == "false" ]
then
	echo "Indicazione upload non valida '${UPLOAD}'"
	echo "Error; usage: ./build.sh snapshot|release [upload:true/false]"
	exit 4
fi

java -fullversion > out.txt 2>&1
JAVA_VERSION=$(cat out.txt)
RESULT=$(cat out.txt | grep "17")
rm -f out.txt

if [ -z "${RESULT}" ]
then
	echo "Richiesta java version 17, trovata: ${JAVA_VERSION}"
	exit 5
fi

find . -name target | xargs rm -rf
export MAVEN_OPTS="-Xmx2048m -XX:MaxMetaspaceSize=2048m --add-opens=java.base/java.lang=ALL-UNNAMED"
mvn install

VERSION=$(ls package/components/target/govway-monitor-ui-components-*.jar  | cut -d '-' -f 5 | cut -d '.' -f 1)
if [ -z "${VERSION}" ]
then
	echo "Versione libreria non trovata in package/components/target/govway-monitor-ui-components-*.jar"
	exit 6
fi

if [ "${UPLOAD}" == "true" ]
then
	echo "Upload to maven repository ..."

	GROUP_ID="org.govway-monitor-ui"

	echo "- jsf"
	bash package/script/deploy.sh package/jsf/target/govway-monitor-ui-jsf-${VERSION}.jar govway-monitor-ui-jsf ${GROUP_ID} ${VERSION} ${RELEASE}

	echo "- api"
	bash package/script/deploy.sh package/api/target/govway-monitor-ui-api-${VERSION}.jar govway-monitor-ui-api ${GROUP_ID} ${VERSION} ${RELEASE}

	echo "- components"
	bash package/script/deploy.sh package/components/target/govway-monitor-ui-components-${VERSION}.jar govway-monitor-ui-components ${GROUP_ID} ${VERSION} ${RELEASE}

	echo "Upload to maven repository finished"
fi
