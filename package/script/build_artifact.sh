VERSION=$1
if [ -z "${VERSION}" ]
then
	echo "Versione non fornita"
	exit 1
fi

TIPO=$2
if [ -z "${TIPO}" ]
then
	echo "Tipo non fornito"
	exit 1
fi

rm -rf govway-monitor-ui-${TIPO}
mkdir govway-monitor-ui-${TIPO}
cp package/script/pom-${TIPO}.xml.template govway-monitor-ui-${TIPO}/pom.xml
sed -i "s/VERSIONE-LIBRERIA/${VERSION}/g" govway-monitor-ui-${TIPO}/pom.xml
mkdir govway-monitor-ui-${TIPO}/src
mkdir govway-monitor-ui-${TIPO}/javadoc
echo "Riscrittura componenti interfaccia utente terza parte utilizzate da GovWayMonitor per risoluzione problematiche di sicurezza e migrazione verso Jakarta EE" > govway-monitor-ui-${TIPO}/javadoc/README

